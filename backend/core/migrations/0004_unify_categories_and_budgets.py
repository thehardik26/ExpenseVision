from django.db import migrations

def unify_categories(apps, schema_editor):
    Category = apps.get_model("core", "Category")
    Budget = apps.get_model("core", "Budget")
    Transaction = apps.get_model("core", "Transaction")

    # 1. Food & Dining -> Food & Drinks
    fd_old = Category.objects.filter(name="Food & Dining").first()
    if fd_old:
        fd_new, _ = Category.objects.get_or_create(
            name="Food & Drinks",
            defaults={"category_type": "Essential", "color": "#10B981", "icon": "utensils"}
        )
        Transaction.objects.filter(category=fd_old).update(category=fd_new)
        for b in Budget.objects.filter(category=fd_old):
            if not Budget.objects.filter(user=b.user, category=fd_new, month=b.month, year=b.year).exists():
                b.category = fd_new
                b.save()
            else:
                b.delete()
        fd_old.delete()

    # 2. Utilities -> Bills & Utilities
    ut_old = Category.objects.filter(name="Utilities").first()
    if ut_old:
        ut_new, _ = Category.objects.get_or_create(
            name="Bills & Utilities",
            defaults={"category_type": "Essential", "color": "#3B82F6", "icon": "zap"}
        )
        Transaction.objects.filter(category=ut_old).update(category=ut_new)
        for b in Budget.objects.filter(category=ut_old):
            if not Budget.objects.filter(user=b.user, category=ut_new, month=b.month, year=b.year).exists():
                b.category = ut_new
                b.save()
            else:
                b.delete()
        ut_old.delete()

def reverse_unify(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_aichathistory_user_alter_aichathistory_role_and_more"),
    ]

    operations = [
        migrations.RunPython(unify_categories, reverse_unify),
    ]
